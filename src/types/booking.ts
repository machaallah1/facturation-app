// Collection "bookings"
type Booking = {
    id: string; // Auto-généré
    numero: string; // "EBKG/1200/6206"
    date: Date; // Pour le tri mensuel
    typeCamion: "20pieds" | "40pieds";
    nombreTC: number;
    fraisTransport: number; // Prix unitaire
    fauxFrais: number; // Prix unitaire
    manutention: {
      facture: number;
      dfu: number;
      honoraire: number;
      caution: number;
    };
    total: number; // Calculé automatiquement
  };