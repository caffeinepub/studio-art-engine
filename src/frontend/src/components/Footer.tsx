import { HeartIcon } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-3">
      <div className="container mx-auto px-4 sm:px-6 text-center text-xs text-muted-foreground font-medium">
        © 2026. Built with{" "}
        <HeartIcon className="inline w-3 h-3 text-red-500 fill-red-500 mx-0.5" />{" "}
        using{" "}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:underline font-semibold"
        >
          caffeine.ai
        </a>
      </div>
    </footer>
  );
}
