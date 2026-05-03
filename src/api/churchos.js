const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let accessToken = localStorage.getItem('churchos_access_token') || null;
let refreshTokenCookie = document.cookie.match(/refreshToken=([^;]+)/)?.[1];

export const setToken = (token) => {
  accessToken = token;
  localStorage.setItem('churchos_access_token', token);
};

export const clearTokens = () => {
  accessToken = null;
  localStorage.removeItem('churchos_access_token');
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
};

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  const config = {
    credentials: 'include',
    headers,
    ...options,
  };

  let response = await fetch(url, config);

  // Auto-refresh expired token
  if (response.status === 401) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      if (refreshRes.ok) {
        const { accessToken: newToken } = await refreshRes.json();
        setToken(newToken);
        
        // Retry original request with new token
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(url, { ...config, headers });
      } else {
        clearTokens();
        window.dispatchEvent(new CustomEvent('churchos:logout'));
        throw new Error('Sessão expirada');
      }
    } catch {
      clearTokens();
      window.dispatchEvent(new CustomEvent('churchos:logout'));
      throw new Error('Sessão expirada');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.erro || `Erro ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
};

// ─────────────────────────────── API HELPERS ───────────────────────────────
const get  = (path, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`${path}${query ? `?${query}` : ''}`);
};

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put  = (path, body) => request(path, { method: 'PUT',  body: JSON.stringify(body) });
const del_ = (path)     => request(path, { method: 'DELETE' });

// ─────────────────────────────── AUTH ─────────────────────────────────────
export const auth = {
  login: (email, senha) => post('/api/auth/login', { email, senha.toString() })
    .then(({ accessToken, usuario }) => {
      setToken(accessToken);
      return usuario;
    }),
  logout: () => post('/api/auth/logout').then(clearTokens),
  me: () => get('/api/auth/me'),
  trocarSenha: (senha_atual, nova_senha) => 
    put('/api/auth/senha', { senha_atual, nova_senha }),
};

// ──────────────────────────── MEMBROS ─────────────────────────────────────
export const membros = {
  listar: (filtros = {}) => get('/api/membros', filtros),
  stats: () => get('/api/membros/stats'),
  aniversariantes: (periodo = 'mes') => get('/api/membros/aniversariantes', { periodo }),
  buscar: (id) => get(`/api/membros/${id}`),
  criar: (dados) => post('/api/membros', dados),
  atualizar: (id, dados) => put(`/api/membros/${id}`, dados),
  inativar: (id) => del_(`/api/membros/${id}`),
};

// ──────────────────────────── FINANCEIRO ───────────────────────────────────
export const financeiro = {
  // Contas Bancárias
  contas: () => get('/api/financeiro/contas'),
  criarConta: (dados) => post('/api/financeiro/contas', dados),
  atualizarConta: (id, dados) => put(`/api/financeiro/contas/${id}`, dados),
  inativarConta: (id) => del_(`/api/financeiro/contas/${id}`),

  // Plano de Contas
  planoContas: () => get('/api/financeiro/plano-contas'),
  criarPlano: (dados) => post('/api/financeiro/plano-contas', dados),
  inativarPlano: (id) => del_(`/api/financeiro/plano-contas/${id}`),

  // Transações
  transacoes: (filtros = {}) => get('/api/financeiro/transacoes', filtros),
  resumo: (filtros = {}) => get('/api/financeiro/transacoes/resumo', filtros),
  criarTransacao: (dados) => post('/api/financeiro/transacoes', dados),
  atualizarTransacao: (id, dados) => put(`/api/financeiro/transacoes/${id}`, dados),
  excluirTransacao: (id) => del_(`/api/financeiro/transacoes/${id}`),

  // Fechamento
  fechamentos: (filtros = {}) => get('/api/financeiro/fechamento', filtros),
  gerarFechamento: (dados) => post('/api/financeiro/fechamento', dados),
  fecharMes: (id) => put(`/api/financeiro/fechamento/${id}/fechar`),

  // Mensalidades
  mensalidades: (filtros = {}) => get('/api/financeiro/mensalidades', filtros),
  registrarMensalidade: (dados) => post('/api/financeiro/mensalidades', dados),
};

// ───────────────────────────── GRUPOS ──────────────────────────────────────
export const grupos = {
  listar: () => get('/api/grupos'),
  membros: (id) => get(`/api/grupos/${id}/membros`),
  criar: (dados) => post('/api/grupos', dados),
  atualizar: (id, dados) => put(`/api/grupos/${id}`, dados),
  adicionarMembro: (id, membro_id) => post(`/api/grupos/${id}/membros`, { membro_id }),
  removerMembro: (id, membro_id) => del_(`/api/grupos/${id}/membros/${membro_id}`),
};

// ──────────────────────────── USUÁRIOS (Admin) ─────────────────────────────
export const usuarios = {
  listar: () => get('/api/usuarios'),
  criar: (dados) => post('/api/usuarios', dados),
  atualizar: (id, dados) => put(`/api/usuarios/${id}`, dados),
  resetSenha: (id, nova_senha) => post(`/api/usuarios/${id}/reset-senha`, { nova_senha }),
};

// ────────────────────────── DEFAULT EXPORT ─────────────────────────────────
export default {
  auth,
  membros,
  financeiro,
  grupos,
  usuarios,
  setToken,
  clearTokens,
};

