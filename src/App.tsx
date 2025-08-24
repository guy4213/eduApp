
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Navigation from "@/components/layout/Navigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Calendar from "./pages/Calendar";
import LessonReport from "./pages/LessonReport";
import Courses from "./pages/Courses";
import CourseAssignments from "./pages/CourseAssignments";
import Rewards from "./pages/Rewards";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import MobileNavigation from "./components/layout/MobileNavigation";
import { VerifyPage } from "./pages/VerifyPage";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect } from "react";
import { initializeDataPersistence } from "@/utils/dataPersistence";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent automatic refetching on window focus to avoid unnecessary API calls
      refetchOnWindowFocus: false,
      // Retry failed requests up to 3 times
      retry: 3,
      // Keep data in cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations up to 2 times
      retry: 2,
    },
  },
});

const App = () => {
  // Initialize data persistence utilities
  useEffect(() => {
    const cleanup = initializeDataPersistence();
    return cleanup;
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                 <Route path="/verify" element={<VerifyPage />} />

                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <div className="min-h-screen">
                          <Navigation />
                          
                          <Index />
                        </div>
                        
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/calendar" 
                    element={
                      <ProtectedRoute>
                        <div className="min-h-screen">
                          <Navigation />
                          <Calendar />
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                      <Route 
                    path="/lesson-report" 
                    element={
                      <ProtectedRoute>
                        <div className="min-h-screen">
                          <Navigation />
                          <LessonReport />
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/lesson-report/:id" 
                    element={
                      <ProtectedRoute>
                        <div className="min-h-screen">
                          <Navigation />
                          <LessonReport />
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                   <Route 
                     path="/courses" 
                     element={
                       <ProtectedRoute>
                         <div className="min-h-screen">
                           <Navigation />
                           <Courses />
                         </div>
                       </ProtectedRoute>
                     } 
                   />
                   <Route 
                     path="/course-assignments" 
                     element={
                       <ProtectedRoute>
                         <div className="min-h-screen">
                           <Navigation />
                           <CourseAssignments />
                         </div>
                       </ProtectedRoute>
                     } 
                   />
                   <Route 
                     path="/rewards" 
                     element={
                       <ProtectedRoute>
                         <div className="min-h-screen">
                           <Navigation />
                           <Rewards />
                         </div>
                       </ProtectedRoute>
                     } 
                   />
                   <Route 
                     path="/reports"
                    element={
                      <ProtectedRoute>
                        <div className="min-h-screen">
                          <Navigation />
                          <Reports />
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <div className="min-h-screen">
                          <Navigation />
                          <Profile />
                        </div>
                      </ProtectedRoute>
                    } 
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </AuthProvider>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
