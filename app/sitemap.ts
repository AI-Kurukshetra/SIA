import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: appUrl,
      priority: 1
    },
    {
      url: `${appUrl}/pricing`,
      priority: 0.8
    },
    {
      url: `${appUrl}/sign-in`,
      priority: 0.7
    }
  ];
}
