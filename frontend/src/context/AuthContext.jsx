import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check local storage on initial mount
    const savedToken = localStorage.getItem('aegis_token');
    const savedUser = localStorage.getItem('aegis_user');
    const savedTenant = localStorage.getItem('aegis_tenant');

    if (savedToken && savedUser && savedTenant) {
      try {
        const decodedUser = JSON.parse(atob(savedToken.split('.')[1]));
        setUser(JSON.parse(savedUser));
        setTenant(JSON.parse(savedTenant));
        setRoles(decodedUser.roles || []);
        setPermissions(decodedUser.permissions || []);
      } catch (e) {
        console.error('Failed to parse saved credentials:', e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (tenantSlug, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', {
        tenantSlug,
        email,
        password
      });

      const { token, user: userData, tenant: tenantData, roles: userRoles, permissions: userPerms } = response.data;

      localStorage.setItem('aegis_token', token);
      localStorage.setItem('aegis_user', JSON.stringify(userData));
      localStorage.setItem('aegis_tenant', JSON.stringify(tenantData));

      setUser(userData);
      setTenant(tenantData);
      setRoles(userRoles);
      setPermissions(userPerms);
      setLoading(false);
      return { user: userData, tenant: tenantData };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || 'Authentication failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerTenant = async (tenantName, tenantSlug, email, name, password) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', {
        tenantName,
        tenantSlug,
        email,
        name,
        password
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || 'Registration failed. Please check details.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('aegis_token');
    localStorage.removeItem('aegis_user');
    localStorage.removeItem('aegis_tenant');
    setUser(null);
    setTenant(null);
    setRoles([]);
    setPermissions([]);
    setError(null);
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionsList) => {
    return permissionsList.some((perm) => permissions.includes(perm));
  };

  const value = {
    user,
    tenant,
    roles,
    permissions,
    loading,
    error,
    login,
    registerTenant,
    logout,
    hasPermission,
    hasAnyPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
