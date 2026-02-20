// Vai buscar a lista de packing lists
export const fetchPackingLists = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/packing-lists${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Falha ao carregar packing lists");
  return res.json();
};

// Vai buscar uma packing list por id
export const fetchPackingListById = async (id) => {
  const res = await fetch(`/api/packing-lists/${id}`);
  if (!res.ok) throw new Error("Packing list não encontrada");
  return res.json();
};

// Cria uma packing list
export const createPackingList = async (payload) => {
  const res = await fetch("/api/packing-lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao gravar");
  return res.json();
};

// Atualiza uma packing list por id
export const updatePackingList = async (id, payload) => {
  const res = await fetch(`/api/packing-lists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao atualizar");
  return res.json();
};

// Remove uma packing list por id
export const deletePackingList = async (id) => {
  const res = await fetch(`/api/packing-lists/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Falha ao remover");
  return res.json();
};
