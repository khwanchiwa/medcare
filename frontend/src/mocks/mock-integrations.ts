export type IntegrationStatus = {
  provider: "Google Calendar";
  connected: boolean;
  account: string;
  lastSync: string;
};

export const integrations: IntegrationStatus[] = [
  { provider: "Google Calendar", connected: true, account: "somchai@gmail.com", lastSync: "6 ก.ค. 2569 09:10" },
];

export async function getIntegrations() {
  return integrations;
}
