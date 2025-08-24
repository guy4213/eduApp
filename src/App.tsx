
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

// Enhanced QueryClient configuration for better data persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes to reduce unnecessary refetches
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      // Retry failed requests
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Enable refetch on window focus but with throttling
      refetchOnWindowFocus: 'always',
      // Don't refetch on reconnect too aggressively
      refetchOnReconnect: 'always',
      // Enable background refetch
      refetchInterval: false, // Disable automatic refetch, let components control it
      // Handle network errors gracefully
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations on network errors
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      networkMode: 'online',
    },
  },
});

const App = () => (
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
