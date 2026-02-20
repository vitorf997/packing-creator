// Vai buscar a lista de matrizes de tamanhos
export const fetchSizeMatrixes = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/size-matrixes${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Falha ao carregar matrizes");
  return res.json();
};

// Vai buscar uma matriz por id
export const fetchSizeMatrixById = async (id) => {
  const res = await fetch(`/api/size-matrixes/${id}`);
  if (!res.ok) throw new Error("Matriz não encontrada");
  return res.json();
};

// Cria uma matriz
export const createSizeMatrix = async (payload) => {
  const res = await fetch("/api/size-matrixes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao gravar");
  return res.json();
};

// Atualiza uma matriz
export const updateSizeMatrix = async (id, payload) => {
  const res = await fetch(`/api/size-matrixes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao atualizar");
  return res.json();
};

// Remove uma matriz
export const deleteSizeMatrix = async (id) => {
  const res = await fetch(`/api/size-matrixes/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Falha ao remover");
  return res.json();
};
