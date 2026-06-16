export const validators = {
  guestName: (val: string) => {
    const trimmed = val.trim();
    if (trimmed.length < 2) return "Name must be at least 2 characters";
    if (trimmed.length > 80) return "Name must be less than 80 characters";
    if (/[<>]/.test(trimmed)) return "Name contains invalid characters";
    return null;
  },
  guestPhone: (val: string) => {
    const trimmed = val.trim();
    if (!/^0[789][01]\d{8}$/.test(trimmed)) {
      return "Enter a valid Nigerian phone number (e.g. 08012345678)";
    }
    return null;
  },
  guestEmail: (val?: string) => {
    if (!val) return null;
    const trimmed = val.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "Enter a valid email address";
    }
    return null;
  },
  numNights: (val: number) => {
    if (!Number.isInteger(val) || val < 1) return "Minimum 1 night required";
    if (val > 30) return "Maximum 30 nights allowed";
    return null;
  },
  uuid: (val: string) => {
    if (!/^[0-9a-f-]{36}$/i.test(val)) return "Invalid reference";
    return null;
  },
};
