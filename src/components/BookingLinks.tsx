import { Bus, Plane, TrainFront, Hotel, Car } from "lucide-react";

const bookingOptions = [
  {
    icon: Bus,
    label: "Bus Tickets",
    href: "https://www.redbus.in",
    color: "from-red-500 to-orange-500",
    hoverBg: "hover:bg-red-500/10",
    borderColor: "border-red-500/30",
    textColor: "text-red-500",
  },
  {
    icon: Plane,
    label: "Flight Tickets",
    href: "https://www.makemytrip.com/flights",
    color: "from-blue-500 to-cyan-500",
    hoverBg: "hover:bg-blue-500/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-500",
  },
  {
    icon: TrainFront,
    label: "Train Tickets",
    href: "https://www.irctc.co.in",
    color: "from-green-500 to-emerald-500",
    hoverBg: "hover:bg-green-500/10",
    borderColor: "border-green-500/30",
    textColor: "text-green-500",
  },
  {
    icon: Hotel,
    label: "Hotels",
    href: "https://www.oyorooms.com",
    color: "from-purple-500 to-violet-500",
    hoverBg: "hover:bg-purple-500/10",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-500",
  },
  {
    icon: Car,
    label: "Cab / Taxi",
    href: "https://www.olacabs.com",
    color: "from-amber-500 to-yellow-500",
    hoverBg: "hover:bg-amber-500/10",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-500",
  },
];

const BookingLinks = () => {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Book Your <span className="gradient-text">Travel</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Quick access to all your travel booking needs in one place.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {bookingOptions.map((option) => {
            const Icon = option.icon;
            return (
              <a
                key={option.label}
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border ${option.borderColor} ${option.hoverBg} bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-36`}
              >
                <div className={`p-4 rounded-xl bg-gradient-to-br ${option.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className={`text-sm font-semibold ${option.textColor}`}>
                  {option.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BookingLinks;
