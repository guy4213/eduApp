
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
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
