import { LogBody, LogEventType } from "@bato-urbanflow/urbanflow-models";
import { Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

export class LogsService {

    constructor(
        @Inject('LOGS_SERVICE') private readonly client: ClientProxy
    ) { }

    sendEvent(event: string, content: any) {
        this.client.emit(event, content);
    }

    sendDeleteUser(email: string) {
        const logUserDeleted = new LogBody("UrbanFlow-User", "200", `User ${email} deleted`)
        this.sendEvent(LogEventType.LOGS_CREATE, logUserDeleted)
    }

    sendUserNotFound() {
        const logUserNotFound = new LogBody("UrbanFlow-User", "404", `User not found by id`)
        this.sendEvent(LogEventType.LOGS_CREATE, logUserNotFound)
    }

}