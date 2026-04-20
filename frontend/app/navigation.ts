import { ROUTES } from "./nav-constants";

export function getRoute(name: keyof typeof ROUTES): string {
  return ROUTES[name];
}
