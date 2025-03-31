import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import BookDetails from "@/pages/book-details";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Admin from "@/pages/admin";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";

function Router() {
  // Check if user is logged in
  const { data: user, isLoading } = useQuery<any>({
    queryKey: ['/api/auth/session'],
    retry: false,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} isLoading={isLoading} />
      
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/books/:id" component={BookDetails} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
      
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
