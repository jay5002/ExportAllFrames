import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/dashboard/Layout'
import DashboardHome from './components/dashboard/DashboardHome'
import MyCourses from './components/dashboard/MyCourses'
import VideoLessons from './components/dashboard/VideoLessons'
import Assignments from './components/dashboard/Assignments'
import Quizzes from './components/dashboard/Quizzes'
import Progress from './components/dashboard/Progress'
import Analytics from './components/dashboard/Analytics'
import Notifications from './components/dashboard/Notifications'
import InstructorDashboard from './components/dashboard/InstructorDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardHome />} />
          <Route path="courses"       element={<MyCourses />} />
          <Route path="video-lessons" element={<VideoLessons />} />
          <Route path="assignments"   element={<Assignments />} />
          <Route path="quizzes"       element={<Quizzes />} />
          <Route path="progress"      element={<Progress />} />
          <Route path="analytics"     element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="instructor" element={<InstructorDashboard />} />
          <Route path="instructor/courses" element={<InstructorDashboard view="courses" />} />
          <Route path="instructor/students" element={<InstructorDashboard view="students" />} />
          <Route path="instructor/grading" element={<InstructorDashboard view="grading" />} />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
