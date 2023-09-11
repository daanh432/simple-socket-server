import { SocketConnection } from './connections';

export interface Rule {
  publish?: string | boolean;
  subscribe?: string | boolean;
}

export class RuleAccessSystem {
  private rules: Record<string, Rule> = {};

  constructor(rules: Record<string, Rule>) {
    this.rules = rules;
  }

  private evaluate(ruleExpression: string, variables: Record<string, any>): boolean {
    try {
      // eslint-disable-next-line no-new-func
      const func = new Function(...Object.keys(variables), `return ${ruleExpression};`);
      return func(...Object.values(variables));
    } catch (error) {
      console.error(`Error while evaluating the expression: ${ruleExpression}`, error);

      return false;
    }
  }

  private findMatchingRule(eventName: string): { rule: Rule; variables: Record<string, any> } | undefined {
    // Try to find an exact match first
    if (this.rules[eventName]) {
      return { rule: this.rules[eventName], variables: {} };
    }

    // Check if the eventName contains a variable and try to find a rule that matches. For example:
    // eventName: "item/1234"
    // rule: "item/$id"
    // eventName: "item/1234/attribute"
    // rule: "item/$id/attribute"
    const eventParts = eventName.split('/');
    for (const ruleName of Object.keys(this.rules)) {
      const ruleParts = ruleName.split('/');
      if (eventParts.length === ruleParts.length) {
        const variables: Record<string, any> = {};
        let match = true;
        for (let i = 0; i < eventParts.length; i++) {
          if (ruleParts[i].startsWith('$')) {
            variables[ruleParts[i]] = eventParts[i];
          } else if (eventParts[i] !== ruleParts[i]) {
            match = false;
            break;
          }
        }

        if (match) {
          return { rule: this.rules[ruleName], variables: variables };
        }
      }
    }

    // Check if the eventName matches a wildcard rule. For example:
    // eventName: "item/1234/attribute"
    // rule: "item/*"
    for (const ruleName of Object.keys(this.rules)) {
      const ruleParts = ruleName.split('/');
      if (ruleParts.length > 0 && ruleParts[ruleParts.length - 1] === '*') {
        const partialRule = ruleParts.slice(0, ruleParts.length - 1).join('/');
        const partialEvent = eventParts.slice(0, ruleParts.length - 1).join('/');
        if (partialRule === partialEvent) {
          return { rule: this.rules[ruleName], variables: {} };
        }
      }
    }

    return undefined;
  }

  canPublish(eventName: string, user: Record<string, any> | null | undefined): boolean {
    if (user == undefined) {
      return false;
    }

    const eventRules = this.findMatchingRule(eventName);

    if (eventRules === undefined || eventRules.rule.publish === undefined) {
      return false;
    }

    if (typeof eventRules.rule.publish === 'boolean') {
      return eventRules.rule.publish;
    }

    return this.evaluate(eventRules.rule.publish, {
      user: user,
      ...eventRules.variables,
    });
  }

  canSubscribe(eventName: string, user: Record<string, any> | null | undefined): boolean {
    if (user == undefined) {
      return false;
    }

    const eventRules = this.findMatchingRule(eventName);

    if (eventRules === undefined || eventRules.rule.subscribe === undefined) {
      return false;
    }

    if (typeof eventRules.rule.subscribe === 'boolean') {
      return eventRules.rule.subscribe;
    }

    return this.evaluate(eventRules.rule.subscribe, {
      user: user,
      ...eventRules.variables,
    });
  }
}

export class AuthenticationManager {
  private static instance = new AuthenticationManager();
  private readonly authWebhookUrl: string;
  private readonly rulesWebhookurl: string;

  private _ruleAccessSystem: RuleAccessSystem | undefined;
  private _ruleAccessSystemCacheTime: number = 0;

  public static getInstance(): AuthenticationManager {
    return this.instance;
  }

  constructor() {
    this.authWebhookUrl = process.env.AUTH_WEBHOOK_URL ?? 'http://localhost:8080/api/v1/socket/auth';
    this.rulesWebhookurl = process.env.AUTH_RULES_WEBHOOK_URL ?? 'http://localhost:8080/api/v1/socket/rules';
  }

  public async authenticate(data: unknown, socket: SocketConnection): Promise<boolean> {
    // using node-fetch
    // send post to webhookUrl with data and on successfull response return the response as if it is the user info
    // on error return null

    socket.setUser({ id: '1234', role: 'user' });
    return true;
  }

  private async fetchRules(): Promise<RuleAccessSystem> {
    // using node-fetch send get to rulesWebhookurl and return the response as a RuleAccessSystem
    // cache the response for 5 minutes at minimum or respect the cache control header

    const ruleFile = {
      chat: {
        publish: true,
        subscribe: true,
      },
    };

    return new RuleAccessSystem(ruleFile);
  }

  public async canPublish(topic: string, socket: SocketConnection): Promise<boolean> {
    if (socket.getUser() == undefined) {
      return false;
    }

    const ruleSystem = await this.fetchRules();

    return ruleSystem.canPublish(topic, socket.getUser()!);
  }

  public async canSubscribe(topic: string, socket: SocketConnection): Promise<boolean> {
    if (socket.getUser() == undefined) {
      return false;
    }

    const ruleSystem = await this.fetchRules();

    return ruleSystem.canPublish(topic, socket.getUser()!);
  }
}
