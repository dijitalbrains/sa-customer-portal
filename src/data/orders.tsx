import type { OrderAccordionProps } from "@/components/features/filter-renewal";

export const orderData: OrderAccordionProps[] = [
  {
    orderNumber: "SA-99421-B",
    placedDate: "Oct 14, 2023 \u2022 09:45 AM",
    items: [
      {
        iconSrc: "/assets/icons/water-drop.svg",
        title: "WET 5 | Office",
        filters: [
          {
            iconSrc: "/assets/icons/filter-renewal.svg",
            title: "Full Renewal",
            location: "Main Kitchen",
            price: "$519.30",
            status: "active",
            frequency: "Every 18 month",
            remaining: "12 months remaining",
            nextDate: "Friday, August 30 2024",
            shipTo: "3404 Nottingham Road Ocean Springs, MS 39564",
            loyalty: (
              <span>
                You&apos;ve saved <span className="font-bold">$834.00</span> being
                a loyalty customer
              </span>
            ),
            progress: 5,
          },
          {
            iconSrc: "/assets/icons/filter-expired.svg",
            title: "P1 Filter",
            location: "Main Kitchen",
            price: "$519.30",
            status: "expired",
            frequency: "Every 18 month",
            nextDate: "Friday, August 30 2024",
            shipTo: "3404 Nottingham Road Ocean Springs, MS 39564",
            loyalty: (
              <span>
                You&apos;ve saved <span className="font-bold">$834.00</span> being
                a loyalty customer
              </span>
            ),
            progress: 100,
          },
        ],
      },
      {
        iconSrc: "/assets/icons/shower.svg",
        title: "Shower Filter | Shower Filter 1",
        filters: [
          {
            iconSrc: "/assets/icons/filter-active.svg",
            title: "Replacement Filter",
            location: "Shower Filter",
            price: "$519.30",
            status: "active",
            frequency: "Every 18 month",
            remaining: "12 months remaining",
            nextDate: "Friday, August 30 2024",
            shipTo: "3404 Nottingham Road Ocean Springs, MS 39564",
            loyalty: (
              <div>
                <p className="text-brand-primary">Join the loyalty program.</p>
                <p>Cancel at anytime.</p>
              </div>
            ),
            progress: 5,
          },
        ],
      },
    ],
  },
];
