import { Compass, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  const footerLinks = {
    company: [
      { labelKey: "footer.aboutUs", href: "#" },
      { labelKey: "footer.careers", href: "#" },
      { labelKey: "footer.press", href: "#" },
      { labelKey: "footer.blog", href: "#" },
    ],
    support: [
      { labelKey: "footer.helpCenter", href: "#" },
      { labelKey: "footer.safety", href: "#" },
      { labelKey: "footer.termsOfService", href: "#" },
      { labelKey: "footer.privacyPolicy", href: "#" },
    ],
    discover: [
      { labelKey: "footer.destinations", href: "#destinations" },
      { labelKey: "footer.experiences", href: "#experiences" },
      { labelKey: "footer.travelGuides", href: "#" },
      { labelKey: "footer.giftCards", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Youtube, href: "#", label: "Youtube" },
  ];

  return (
    <footer className="bg-gradient-to-b from-background to-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">VirtueYatra</span>
            </div>
            <p className="text-muted-foreground mb-6">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.company')}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.support')}</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.discover')}</h3>
            <ul className="space-y-3">
              {footerLinks.discover.map((link) => (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 VirtueYatra
          </p>
          
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-muted hover:bg-primary text-muted-foreground hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
