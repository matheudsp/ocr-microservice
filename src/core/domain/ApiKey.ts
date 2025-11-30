export type ApiKeyRole = "ADMIN" | "CLIENT";

export interface ApiKeyProps {
  id: string;
  key: string;
  client: string;
  role: ApiKeyRole;
  webhookUrl?: string;
  allowedIp?: string;
  webhookSecret?: string;
  isActive: boolean;
  createdAt: Date;
}

export class ApiKey {
  public readonly id: string;
  public readonly key: string;
  public readonly client: string;
  public readonly role: ApiKeyRole;
  public readonly webhookUrl?: string;
  public readonly allowedIp?: string;
  public readonly webhookSecret?: string;
  public readonly isActive: boolean;
  public readonly createdAt: Date;

  private constructor(props: ApiKeyProps) {
    this.id = props.id;
    this.key = props.key;
    this.client = props.client;
    this.role = props.role;
    this.webhookUrl = props.webhookUrl;
    this.allowedIp = props.allowedIp;
    this.webhookSecret = props.webhookSecret;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
  }

  static create(props: ApiKeyProps): ApiKey {
    return new ApiKey(props);
  }

  static restore(props: ApiKeyProps): ApiKey {
    return new ApiKey(props);
  }
}
