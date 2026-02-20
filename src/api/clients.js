// Vai buscar a lista de clientes
export const fetchClients = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/clients${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Falha ao carregar clientes");
  return res.json();
};

// Vai buscar um cliente por id
export const fetchClientById = async (id) => {
  const res = await fetch(`/api/clients/${id}`);
  if (!res.ok) throw new Error("Cliente não encontrado");
  return res.json();
};

// Cria um cliente
export const createClient = async (payload) => {
  const res = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao gravar");
  return res.json();
};

// Atualiza um cliente
export const updateClient = async (id, payload) => {
  const res = await fetch(`/api/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Falha ao atualizar");
  return res.json();
};

// Remove um cliente
export const deleteClient = async (id) => {
  const res = await fetch(`/api/clients/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Falha ao remover");
  return res.json();
};
