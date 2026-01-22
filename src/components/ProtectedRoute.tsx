import { Navigate, useLocation } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { UserRole } from '@/lib/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requiredPermission?: string
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
}: ProtectedRouteProps) {
  const { currentUser, checkPermission } = useData()
  const location = useLocation()

  if (!currentUser) {
    // Should theoretically redirect to login, but we use a switcher for now
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Check roles
  if (requiredRoles && !requiredRoles.includes(currentUser.role)) {
    return <Navigate to="/access-denied" replace />
  }

  // Check specific permission
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return <Navigate to="/access-denied" replace />
  }

  return <>{children}</>
}
