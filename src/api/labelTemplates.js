// Vai buscar a lista de templates de etiqueta
export const fetchLabelTemplates = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/label-templates${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Falha ao carregar templates");
  return res.json();
};

// Cria um template de etiqueta
export const createLabelTemplate = async (payload) => {
  const res = await fetch("/api/label-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao criar template");
  return res.json();
};

// Atualiza um template de etiqueta
export const updateLabelTemplate = async (id, payload) => {
  const res = await fetch(`/api/label-templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao atualizar template");
  return res.json();
};
