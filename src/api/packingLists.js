// Vai buscar a lista de Packings
export const fetchPackingLists = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/packing-lists${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Falha ao carregar Packings");
  return res.json();
};

// Vai buscar um Packing por id
export const fetchPackingListById = async (id) => {
  const res = await fetch(`/api/packing-lists/${id}`);
  if (!res.ok) throw new Error("Packing não encontrado");
  return res.json();
};

// Cria um Packing
export const createPackingList = async (payload) => {
  const res = await fetch("/api/packing-lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao gravar");
  return res.json();
};

// Atualiza um Packing por id
export const updatePackingList = async (id, payload) => {
  const res = await fetch(`/api/packing-lists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao atualizar");
  return res.json();
};

// Remove um Packing por id
export const deletePackingList = async (id) => {
  const res = await fetch(`/api/packing-lists/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Falha ao remover");
  return res.json();
};
