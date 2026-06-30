export interface AmazonConnectEvent {
  Details?: {
    ContactData?: {
      ContactId?: string;
      CustomerEndpoint?: {
        Address?: string;
      };
    };
  };
}

export type AmazonConnectResponse = Record<string, string>;
