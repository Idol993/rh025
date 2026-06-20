import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Personnel from './pages/Personnel'
import Safety from './pages/Safety'
import Equipment from './pages/Equipment'
import Material from './pages/Material'
import Progress from './pages/Progress'
import Salary from './pages/Salary'
import WorkOrder from './pages/WorkOrder'
import GroupMonitor from './pages/GroupMonitor'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="personnel" element={<Personnel />} />
        <Route path="safety" element={<Safety />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="material" element={<Material />} />
        <Route path="progress" element={<Progress />} />
        <Route path="salary" element={<Salary />} />
        <Route path="workorder" element={<WorkOrder />} />
        <Route path="group" element={<GroupMonitor />} />
      </Route>
    </Routes>
  )
}

export default App
