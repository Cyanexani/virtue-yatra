import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Compass, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: t('nav.destinations'), href: "#destinations" },
    { label: t('nav.experiences'), href: "#experiences" },
    { label: t('nav.plan'), href: "#plan" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "glass-effect shadow-lg"
          : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
            <Compass className="w-8 h-8 text-primary transition-transform duration-500 group-hover:rotate-180" />
            <span className="text-2xl font-bold gradient-text">VirtueYatra</span>
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-foreground font-medium hover:text-primary transition-colors duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-primary/30 hover:bg-primary/10">
                    <User className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" className="hover:bg-primary/10" onClick={() => navigate("/auth")}>
                  {t('nav.signIn')}
                </Button>
                <Button 
                  className="bg-gradient-to-r from-primary to-travel-ocean hover:scale-105 transition-transform duration-300 shadow-md"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 glass-effect rounded-2xl p-6 animate-slide-up">
            <ul className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-foreground font-medium hover:text-primary transition-colors duration-300 block py-2"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-4 border-t border-border">
                <LanguageSwitcher />
              </li>
              <li className="pt-4 border-t border-border space-y-3">
                {user ? (
                  <>
                    <p className="text-sm text-muted-foreground px-2">
                      Signed in as {user.email?.split('@')[0]}
                    </p>
                    <Button variant="ghost" className="w-full hover:bg-primary/10" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.signOut')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full hover:bg-primary/10" onClick={() => { navigate("/auth"); setIsMobileMenuOpen(false); }}>
                      {t('nav.signIn')}
                    </Button>
                    <Button className="w-full bg-gradient-to-r from-primary to-travel-ocean" onClick={() => { navigate("/auth"); setIsMobileMenuOpen(false); }}>
                      Get Started
                    </Button>
                  </>
                )}
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
