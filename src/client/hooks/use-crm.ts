import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { api } from "../api";
import type {
  Contact, Company, Deal, Stats, PaginatedState, StageDef,
  Activity, ConnectionStatus, EntityType, CustomFieldDef, ImportRow, ImportEntity, ImportResult, PipelineKey, VipInviteCode,
} from "../types";
import type { CrmContextValue } from "../context";
import { DEFAULT_PIPELINE } from "@/lib/pipelines";

const defaultPag = (sort: string): PaginatedState => ({
  page: 1, limit: 25, total: 0, sort, order: "desc", search: "", filters: [],
});

function pagParams(pag: PaginatedState, pipeline: PipelineKey): URLSearchParams {
  const p = new URLSearchParams({
    page: String(pag.page), limit: String(pag.limit), sort: pag.sort, order: pag.order, pipeline,
  });
  if (pag.search) p.set("search", pag.search);
  if (pag.filters.length) p.set("filters", JSON.stringify(pag.filters));
  return p;
}

export function useCrmState(isAgent: boolean): CrmContextValue {
  const [stats, setStats] = useState<Stats>({ contacts: 0, companies: 0, deals: 0, dealValue: 0 });
  const [activePipeline, setActivePipeline] = useState<PipelineKey>(DEFAULT_PIPELINE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsPag, setContactsPag] = useState<PaginatedState>(defaultPag("created_at"));
  const [inviteCodes, setInviteCodes] = useState<VipInviteCode[]>([]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesPag, setCompaniesPag] = useState<PaginatedState>(defaultPag("created_at"));

  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsPag, setDealsPag] = useState<PaginatedState>(defaultPag("created_at"));
  const [dealsTotalValue, setDealsTotalValue] = useState(0);
  const [boardDeals, setBoardDeals] = useState<Deal[]>([]);

  const [connections, setConnections] = useState<ConnectionStatus>({ email: false, meeting: false, slack: false });
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [stages, setStages] = useState<StageDef[]>([]);

  // ── Fetchers ──

  const fetchStats = useCallback(async () => {
    setStats(await api<Stats>("GET", "/api/stats"));
  }, []);

  const fetchContacts = useCallback(async (pag: PaginatedState) => {
    const data = await api<{ contacts: Contact[]; total: number }>("GET", `/api/contacts?${pagParams(pag, activePipeline)}`);
    setContacts(data.contacts);
    setContactsPag((prev) => ({ ...prev, total: data.total }));
  }, [activePipeline]);

  const refetchInviteCodes = useCallback(async () => {
    const data = await api<{ codes: VipInviteCode[] }>("GET", "/api/vip-invite-codes");
    setInviteCodes(data.codes);
  }, []);

  const fetchCompanies = useCallback(async (pag: PaginatedState) => {
    const data = await api<{ companies: Company[]; total: number }>("GET", `/api/companies?${pagParams(pag, activePipeline)}`);
    setCompanies(data.companies);
    setCompaniesPag((prev) => ({ ...prev, total: data.total }));
  }, [activePipeline]);

  const fetchDeals = useCallback(async (pag: PaginatedState) => {
    const data = await api<{ deals: Deal[]; total: number; totalValue: number }>("GET", `/api/deals?${pagParams(pag, activePipeline)}`);
    setDeals(data.deals);
    setDealsPag((prev) => ({ ...prev, total: data.total }));
    setDealsTotalValue(data.totalValue);
  }, [activePipeline]);

  const fetchBoardDeals = useCallback(async () => {
    const data = await api<{ deals: Deal[] }>("GET", `/api/deals/board?pipeline=${activePipeline}`);
    setBoardDeals(data.deals);
  }, [activePipeline]);

  const fetchConnections = useCallback(async () => {
    try {
      setConnections(await api<ConnectionStatus>("GET", "/api/integrations/status"));
    } catch {
      /* off-platform / no broker — leave everything disconnected */
    }
  }, []);

  const refetchCustomFields = useCallback(async () => {
    const data = await api<{ defs: CustomFieldDef[] }>("GET", "/api/custom-fields");
    setCustomFields(data.defs);
  }, []);

  const refetchStages = useCallback(async () => {
    const data = await api<{ stages: StageDef[] }>("GET", `/api/stages?pipeline=${activePipeline}`);
    setStages(data.stages);
  }, [activePipeline]);

  // ── Initial load ──

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStats(), fetchContacts(contactsPag), fetchCompanies(companiesPag),
          fetchDeals(dealsPag), fetchBoardDeals(), fetchConnections(),
          refetchCustomFields(), refetchStages(), refetchInviteCodes(),
        ]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Per-list refetch when its pagination/sort/search changes ──

  useEffect(() => { fetchContacts(contactsPag).catch((e) => setError((e as Error).message)); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePipeline, contactsPag.page, contactsPag.sort, contactsPag.order, contactsPag.search, JSON.stringify(contactsPag.filters)]);
  useEffect(() => { fetchCompanies(companiesPag).catch((e) => setError((e as Error).message)); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePipeline, companiesPag.page, companiesPag.sort, companiesPag.order, companiesPag.search, JSON.stringify(companiesPag.filters)]);
  useEffect(() => { fetchDeals(dealsPag).catch((e) => setError((e as Error).message)); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activePipeline, dealsPag.page, dealsPag.sort, dealsPag.order, dealsPag.search]);

  useEffect(() => {
    fetchBoardDeals().catch((e) => setError((e as Error).message));
    refetchStages().catch((e) => setError((e as Error).message));
  }, [activePipeline, fetchBoardDeals, refetchStages]);

  // ── Pagination setters ──

  const makeSetters = (setter: Dispatch<SetStateAction<PaginatedState>>) => ({
    setPage: (page: number) => setter((p) => ({ ...p, page })),
    setSort: (col: string) => setter((p) => ({ ...p, sort: col, order: p.sort === col && p.order === "asc" ? "desc" : "asc", page: 1 })),
    setSearch: (search: string) => setter((p) => ({ ...p, search, page: 1 })),
    setFilters: (filters: PaginatedState["filters"]) => setter((p) => ({ ...p, filters, page: 1 })),
  });
  const cSet = makeSetters(setContactsPag);
  const coSet = makeSetters(setCompaniesPag);
  const dSet = makeSetters(setDealsPag);

  // ── Contacts CRUD ──

  const addContact = useCallback(async (data: Partial<Contact>) => {
    await api("POST", "/api/contacts", { pipeline: activePipeline, ...data });
    await Promise.all([fetchContacts(contactsPag), fetchStats()]);
  }, [activePipeline, contactsPag, fetchContacts, fetchStats]);

  const updateContact = useCallback(async (id: string, data: Partial<Contact>) => {
    await api("PUT", `/api/contacts/${id}`, data);
    await fetchContacts(contactsPag);
  }, [contactsPag, fetchContacts]);

  const deleteContact = useCallback(async (id: string) => {
    await api("DELETE", `/api/contacts/${id}`);
    await Promise.all([fetchContacts(contactsPag), fetchStats()]);
  }, [contactsPag, fetchContacts, fetchStats]);

  const fetchContact = useCallback(async (id: string): Promise<Contact | null> => {
    try {
      const data = await api<{ contact: Contact }>("GET", `/api/contacts/${id}`);
      return data.contact;
    } catch {
      return null;
    }
  }, []);

  const generateInviteCodes = useCallback(async (count: number, eventSlug: string, inviteeName: string, attendeeType: string): Promise<string[]> => {
    const data = await api<{ links: string[] }>("POST", "/api/vip-invite-codes", { count, eventSlug, inviteeName, attendeeType });
    await refetchInviteCodes();
    return data.links;
  }, [refetchInviteCodes]);

  const deleteInviteCode = useCallback(async (code: string) => {
    await api("DELETE", `/api/vip-invite-codes/${encodeURIComponent(code)}`);
    await refetchInviteCodes();
  }, [refetchInviteCodes]);

  // ── Companies CRUD ──

  const addCompany = useCallback(async (data: Partial<Company>) => {
    await api("POST", "/api/companies", { pipeline: activePipeline, ...data });
    await Promise.all([fetchCompanies(companiesPag), fetchStats()]);
  }, [activePipeline, companiesPag, fetchCompanies, fetchStats]);

  const updateCompany = useCallback(async (id: string, data: Partial<Company>) => {
    await api("PUT", `/api/companies/${id}`, data);
    await fetchCompanies(companiesPag);
  }, [companiesPag, fetchCompanies]);

  const deleteCompany = useCallback(async (id: string) => {
    await api("DELETE", `/api/companies/${id}`);
    await Promise.all([fetchCompanies(companiesPag), fetchStats()]);
  }, [companiesPag, fetchCompanies, fetchStats]);

  // ── Deals CRUD ──

  const addDeal = useCallback(async (data: Partial<Deal>) => {
    await api("POST", "/api/deals", { pipeline: activePipeline, ...data });
    await Promise.all([fetchDeals(dealsPag), fetchBoardDeals(), fetchStats()]);
  }, [activePipeline, dealsPag, fetchDeals, fetchBoardDeals, fetchStats]);

  const updateDeal = useCallback(async (id: string, data: Partial<Deal>) => {
    await api("PUT", `/api/deals/${id}`, data);
    await Promise.all([fetchDeals(dealsPag), fetchBoardDeals(), fetchStats()]);
  }, [dealsPag, fetchDeals, fetchBoardDeals, fetchStats]);

  const deleteDeal = useCallback(async (id: string) => {
    await api("DELETE", `/api/deals/${id}`);
    await Promise.all([fetchDeals(dealsPag), fetchBoardDeals(), fetchStats()]);
  }, [dealsPag, fetchDeals, fetchBoardDeals, fetchStats]);

  // ── Integrations & timeline ──

  const emailContact = useCallback(async (contactId: string, subject: string, body: string) => {
    await api("POST", "/api/integrations/email", { contact_id: contactId, subject, body });
  }, []);

  const scheduleMeeting = useCallback(async (
    contactId: string,
    data: { summary: string; start_datetime: string; timezone: string; duration_minutes: number },
  ) => {
    await api("POST", "/api/integrations/meeting", { contact_id: contactId, ...data });
  }, []);

  const fetchActivities = useCallback(async (entityType: EntityType, entityId: string) => {
    const data = await api<{ activities: Activity[] }>("GET", `/api/activities?entity_type=${entityType}&entity_id=${entityId}`);
    return data.activities;
  }, []);

  const addNote = useCallback(async (entityType: EntityType, entityId: string, body: string) => {
    await api("POST", "/api/activities", { entity_type: entityType, entity_id: entityId, type: "note", body });
  }, []);

  // ── Bulk import (contacts / companies) ──

  const importEntity = useCallback(
    async (entity: ImportEntity, rows: ImportRow[], opts?: { inferCompanyFromEmail?: boolean }): Promise<ImportResult> => {
      if (entity === "company") {
        const res = await api<ImportResult>("POST", "/api/companies/import", { companies: rows, pipeline: activePipeline });
        await Promise.all([fetchCompanies(companiesPag), fetchStats()]);
        return res;
      }
      const res = await api<ImportResult>("POST", "/api/contacts/import", {
        contacts: rows,
        pipeline: activePipeline,
        inferCompanyFromEmail: opts?.inferCompanyFromEmail ?? false,
      });
      await Promise.all([fetchContacts(contactsPag), fetchStats()]);
      return res;
    },
    [activePipeline, contactsPag, companiesPag, fetchContacts, fetchCompanies, fetchStats],
  );

  return {
    isAgent, activePipeline, setActivePipeline, stats,
    contacts, contactsPag, setContactsPage: cSet.setPage, setContactsSort: cSet.setSort, setContactsSearch: cSet.setSearch, setContactsFilters: cSet.setFilters,
    addContact, updateContact, deleteContact, fetchContact,
    inviteCodes, refetchInviteCodes, generateInviteCodes, deleteInviteCode,
    companies, companiesPag, setCompaniesPage: coSet.setPage, setCompaniesSort: coSet.setSort, setCompaniesSearch: coSet.setSearch, setCompaniesFilters: coSet.setFilters,
    addCompany, updateCompany, deleteCompany,
    deals, dealsPag, dealsTotalValue, setDealsPage: dSet.setPage, setDealsSort: dSet.setSort, setDealsSearch: dSet.setSearch,
    addDeal, updateDeal, deleteDeal, boardDeals,
    connections, emailContact, scheduleMeeting,
    fetchActivities, addNote, importEntity,
    customFields, refetchCustomFields,
    stages, refetchStages,
    refetchBoard: fetchBoardDeals, refetchStats: fetchStats,
    loading, error, setError,
  };
}
