import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { NavigationPending } from "@/components/ui/navigation-pending";
import { buttonVariants } from "@/components/ui/button-variants";

export function PublicFooter() {
  return (
    <footer className="public-footer mt-auto">
      <div className="public-container">
        <div className="public-footer-cta">
          <p className="display-heading">Let’s find your next chapter.</p>
          <Link
            href="/contact"
            className={buttonVariants({ variant: "outline" })}
          >
            Contact us <NavigationPending />
          </Link>
        </div>
        <div className="public-footer-navigation">
          <Brand inverse />
          <nav aria-label="Footer navigation">
            {(
              [
                ["/properties?purpose=sale", "Buy"],
                ["/properties?purpose=rent", "Rent"],
                ["/agents", "Our agents"],
                ["/contact", "Contact"],
                ["/login", "Staff sign-in"],
              ] as const
            ).map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={href === "/login" ? "footer-staff-link" : undefined}
              >
                {label}
                <NavigationPending />
              </Link>
            ))}
          </nav>
        </div>
        <div className="public-footer-bottom">
          <p>
            © {new Date().getFullYear()} Avenor Properties. All rights reserved.
          </p>
          <p>A different view of home.</p>
        </div>
      </div>
    </footer>
  );
}
