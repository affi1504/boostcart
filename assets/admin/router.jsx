import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CampaignList }      from './pages/Campaigns/CampaignList';
import { CampaignEditor }    from './pages/Campaigns/CampaignEditor';
import { CampaignView }      from './pages/Campaigns/CampaignView';
import { AnalyticsDashboard} from './pages/Analytics/AnalyticsDashboard';
import { SettingsPage }      from './pages/Settings/SettingsPage';
import { ImportExportPage }  from './pages/ImportExport/ImportExportPage';

export function Router() {
	return (
		<Routes>
			<Route path="/"                          element={ <Navigate to="/campaigns" replace /> } />
			<Route path="/campaigns"              element={ <CampaignList /> } />
			<Route path="/campaigns/:id/view"     element={ <CampaignView /> } />
			<Route path="/campaigns/:id"          element={ <CampaignEditor /> } />
			<Route path="/analytics"                  element={ <AnalyticsDashboard /> } />
			<Route path="/settings"                   element={ <SettingsPage /> } />
			<Route path="/import-export"              element={ <ImportExportPage /> } />
		</Routes>
	);
}
