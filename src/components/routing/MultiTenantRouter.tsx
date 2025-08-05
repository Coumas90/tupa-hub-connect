import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TenantRouteGuard, OwnerRouteGuard, StaffRouteGuard } from '@/components/guards/TenantRouteGuard';
import { AdminRouteGuard } from '@/components/guards/AdminRouteGuard';
import { OrgSlugValidator } from '@/components/routing/OrgSlugValidator';
import { Layout } from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Recetas from '@/pages/Recetas';
import Academia from '@/pages/Academia';
import Consumo from '@/pages/Consumo';
import Recursos from '@/pages/Recursos';
import MiEquipo from '@/pages/MiEquipo';
import Reposicion from '@/pages/Reposicion';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminOperations } from '@/components/admin/AdminOperations';

/**
 * Router para rutas multitenant /org/:orgSlug/*
 */
export function MultiTenantRouter() {
  return (
    <Routes>
      {/* Multi-tenant routes with org slug validation */}
      <Route path="/:orgSlug/*" element={
        <OrgSlugValidator>
          <Routes>
            {/* Rutas de Owner */}
            <Route path="/owner/*" element={
              <OwnerRouteGuard>
                <Layout />
              </OwnerRouteGuard>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="mi-equipo" element={<MiEquipo />} />
              <Route path="reposicion" element={<Reposicion />} />
              <Route path="recursos" element={<Recursos />} />
              <Route path="consumo" element={<Consumo />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Rutas de Staff (Manager + Barista) */}
            <Route path="/staff/*" element={
              <StaffRouteGuard>
                <Layout />
              </StaffRouteGuard>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="recetas" element={<Recetas />} />
              <Route path="academia" element={<Academia />} />
              <Route path="consumo" element={<Consumo />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Rutas Generales de Tenant (cualquier role no-admin) */}
            <Route path="/*" element={
              <TenantRouteGuard>
                <Layout />
              </TenantRouteGuard>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="recetas" element={<Recetas />} />
              <Route path="academia" element={<Academia />} />
              <Route path="consumo" element={<Consumo />} />
              <Route path="recursos" element={<Recursos />} />
              <Route path="mi-equipo" element={<MiEquipo />} />
              <Route path="reposicion" element={<Reposicion />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </OrgSlugValidator>
      } />
    </Routes>
  );
}

/**
 * Router simplificado para rutas de admin
 */
export function AdminRouter() {
  return (
    <Routes>
      <Route path="/admin/*" element={
        <AdminRouteGuard>
          <Layout />
        </AdminRouteGuard>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="operations" element={<AdminOperations />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}