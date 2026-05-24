export const scrollToSection = (target: string | HTMLElement | null): void => {
  const element =
    typeof target === "string" ? document.getElementById(target) : target;
  if (!element) return;

  const nav =
    document.querySelector("nav") ?? document.querySelector("header");
  const navHeight = nav?.offsetHeight ?? 0;
  const navPosition = nav ? getComputedStyle(nav).position : "static";
  const breathingRoom = 16;
  const offset = ["fixed", "sticky"].includes(navPosition)
    ? navHeight + breathingRoom
    : breathingRoom;

  const top =
    element.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({ top, behavior: "smooth" });
};
