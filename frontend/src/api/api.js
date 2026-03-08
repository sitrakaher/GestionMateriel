import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 🔹 Gestion du token
export function setToken(token) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

// ---------- Auth ----------
export async function login(email, password, role, service) {
  try {
    const res = await api.post("/auth/login", { email, password, role, service });
    return res.data;
  } catch (err) {
    const errorDetail = err.response?.data?.detail;
    let errorMessage = "Erreur lors de la connexion";
    
    if (Array.isArray(errorDetail)) {
      errorMessage = errorDetail.map(e => e.msg).join(', ');
    } else if (typeof errorDetail === 'string') {
      errorMessage = errorDetail;
    } else if (errorDetail && typeof errorDetail === 'object') {
      errorMessage = errorDetail.msg || JSON.stringify(errorDetail);
    }
    
    return { error: errorMessage };
  }
}

export function logout() {
  localStorage.removeItem("token");
  delete api.defaults.headers.common["Authorization"];
}

export async function forgotPassword(email) {
  try {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  } catch (err) {
    return { error: err.response?.data?.detail || "Erreur lors de la requête" };
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const res = await api.post("/auth/reset-password", { token, new_password: newPassword });
    return res.data;
  } catch (err) {
    return { error: err.response?.data?.detail || "Erreur lors de la requête" };
  }
}

// ---------- Users ----------
export async function getUsers() {
  try {
    const res = await api.get("/users");
    return res.data;
  } catch {
    return [];
  }
}

export async function inscription(email, password, role, service_id) {
  try {
    const res = await api.post("/users", { email, password, role, service_id });
    return res.data;
  } catch (err) {
    return { error: err.response?.data?.detail || "Erreur lors de l'inscription" };
  }
}

export async function deleteUser(userId) {
  try {
    const res = await api.delete(`/users/${userId}`);
    return res.data || { success: true };
  } catch (err) {
    console.error("Erreur API deleteUser :", err);
    throw err;
  }
}

export async function updateUser(userId, data) {
  try {
    const res = await api.put(`/users/${userId}`, data);
    return res.data;
  } catch (err) {
    console.error("Erreur API updateUser :", err);
    throw err;
  }
}

// ---------- Services ----------
export async function getServices() {
  try {
    const res = await api.get("/services");
    return res.data;
  } catch {
    return [];
  }
}

export async function addService(nom) {
  try {
    const res = await api.post("/services", { nom });
    return res.data;
  } catch (err) {
    console.error("Erreur API addService :", err);
    return null;
  }
}

export async function updateService(serviceId, nom) {
  try {
    const res = await api.put(`/services/${serviceId}`, { nom });
    return res.data;
  } catch (err) {
    console.error("Erreur API updateService :", err);
    return null;
  }
}

export async function deleteService(serviceId) {
  try {
    const res = await api.delete(`/services/${serviceId}`);
    return res.data || true;
  } catch (err) {
    console.error("Erreur API deleteService :", err);
    return false;
  }
}

// ---------- Matériels ----------
export const getMateriels = async () => {
  try {
    const res = await api.get("/materiels/");
    return res.data;
  } catch (err) {
    console.error("Erreur récupération matériels:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la récupération des matériels" };
  }
};

export const addMateriel = async (materiel) => {
  try {
    const res = await api.post("/materiels/", materiel);
    return res.data;
  } catch (err) {
    console.error("Erreur ajout matériel:", err);
    return { error: err.response?.data?.detail || "Erreur lors de l'ajout du matériel" };
  }
};

export const updateMateriel = async (id, materiel) => {
  try {
    const res = await api.put(`/materiels/${id}`, materiel);
    return res.data;
  } catch (err) {
    console.error("Erreur modification matériel:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la modification du matériel" };
  }
};

export const deleteMateriel = async (id) => {
  try {
    const res = await api.delete(`/materiels/${id}`);
    return res.data || true;
  } catch (err) {
    console.error("Erreur suppression matériel:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la suppression du matériel" };
  }
};

// ---------- Demandes ----------
export async function getDemandes(service = null) {
  try {
    const url = service ? `/demandes?service=${service}` : "/demandes";
    const res = await api.get(url);
    return res.data;
  } catch (err) {
    console.error("Erreur récupération demandes:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la récupération des demandes" };
  }
}

export async function createDemande(demandeur_id, service_id, lignes) {
  try {
    const res = await api.post("/demandes/", { 
      demandeur_id, 
      service_id,  // Changé de service_id à service
      lignes 
    });
    return res.data;
  } catch (err) {
    console.error("Erreur création demande:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la création de la demande" };
  }
}

export async function updateDemandeStatus(demandeId, status) {
  try {
    const res = await api.put(`/demandes/${demandeId}/status`, { status });
    return res.data;
  } catch (err) {
    console.error("Erreur mise à jour statut demande:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la mise à jour du statut" };
  }
}

export async function updateDemande(demandeId, payload) {
  try {
    const res = await api.put(`/demandes/${demandeId}`, payload);
    return res.data;
  } catch (err) {
    console.error("Erreur modification demande:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la modification de la demande" };
  }
}

// ---------- Livraisons ----------
export async function updateLivraison(demandeId, type, quantite = null) {
  try {
    const payload = type === "partiel" ? { status: type, quantite } : { status: type };
    const res = await api.put(`/demandes/${demandeId}/livraison`, payload);
    return res.data;
  } catch (err) {
    console.error("Erreur mise à jour livraison:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la mise à jour de la livraison" };
  }
}

// ---------- Notifications ----------
export async function getNotifications() {
  try {
    const res = await api.get("/notifications/");
    return res.data;
  } catch (err) {
    console.error("Erreur récupération notifications:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la récupération des notifications" };
  }
}

export async function addNotification(userId, message) {
  try {
    const res = await api.post("/notifications/", {
      user_id: userId,
      message,
    });
    return res.data;
  } catch (err) {
    console.error("Erreur API addNotification:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la création de la notification" };
  }
}

export async function markNotificationRead(id) {
  try {
    const res = await api.put(`/notifications/${id}/lu`);
    return res.data;
  } catch (err) {
    console.error("Erreur marquer notification comme lue:", err);
    return { error: err.response?.data?.detail || "Erreur lors de la mise à jour" };
  }
}

export default api;