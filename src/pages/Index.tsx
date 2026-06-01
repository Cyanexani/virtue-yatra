import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import BookingLinks from "@/components/BookingLinks";
import Destinations from "@/components/Destinations";
import Experiences from "@/components/Experiences";
import TripPlanner from "@/components/TripPlanner";
import TripMap from "@/components/TripMap";
import Chatbot from "@/components/Chatbot";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <BookingLinks />
        <Destinations />
        <Experiences />
        <TripPlanner />
        <TripMap />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

export default Index;
