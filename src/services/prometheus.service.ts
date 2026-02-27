import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';
import { IPrometheusService } from '../interfaces/IPrometheusService';

@Injectable()
export class PrometheusService implements IPrometheusService {
  private readonly register: client.Registry;

  constructor() {
    this.register = new client.Registry();
    this.register.setDefaultLabels({ app: 'urbanflow-user' });
    client.collectDefaultMetrics({ register: this.register });
  }

  getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
