const parseApiError = async (res, fallback) => {
  try {
    const data = await res.json();
    if (data?.error) return data.error;
  } catch (error) {
    // Ignora erro de parse e usa fallback
  }
  return fallback;
};

// Vai buscar a lista de templates de packing
export const fetchPackingTemplates = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/packing-templates${query ? `?${query}` : ""}`);
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Falha ao carregar templates de packing"));
  }
  return res.json();
};

// Cria um template de packing
export const createPackingTemplate = async (payload) => {
  const res = await fetch("/api/packing-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Falha ao criar template de packing"));
  }
  return res.json();
};

// Atualiza um template de packing
export const updatePackingTemplate = async (id, payload) => {
  const res = await fetch(`/api/packing-templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Falha ao atualizar template de packing"));
  }
  return res.json();
};

// Remove um template de packing
export const deletePackingTemplate = async (id) => {
  const res = await fetch(`/api/packing-templates/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await parseApiError(res, "Falha ao remover template de packing"));
  }
  return res.json();
};
