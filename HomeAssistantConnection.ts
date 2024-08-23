import axios, {Method} from "axios";
import url from "url";

export class HomeAssistantConnection {

    constructor(homeAssistantUrl: string, accessToken: string) {
        this.homeAssistantUrl = homeAssistantUrl;
        this.accessToken = accessToken;
    }

    private homeAssistantUrl;
    /**
     * http://homeassistant.local:8123 -> Benutzer-> Langlebige Zugangs-Token
     * @private
     */
    private accessToken;

    /**
     * Schaltet ein Switch (z.b Steckdose) ein/aus
     * @param entitiyId
     * @param value
     * @private
     */
    async toggleSwitch(entitiyId: string, value:boolean) {
        const stringValue = value ? "on" : "off";
        await this.homeassistantRequest("api/services/switch/turn_" + stringValue, "post", {"entity_id": entitiyId});

        if(!(await this.getStateOfEntity(entitiyId) === stringValue)) {
            throw new Error("Error switching entity " + entitiyId + " to " + stringValue);
        }

        /* No need for polling:
        const timeout = 5000;
        let start = new Date();
        while(!(await this.getStateOfEntity(entitiyId) === stringValue)) {
            if(new Date().getTime() - start.getTime() > timeout) { // Timeout ?
                throw "Error switching entity " + entitiyId + " to " + stringValue;
            }
            sleep(20);
        }
        */

    }

    /**
     *
     * @param sensorId
     * @private
     * @return number for numeric sensor
     */
    private async getSensorValue(sensorId: string): Promise<number | null> {
        return this.getStateOfEntity(sensorId);
    }

    public async getStateOfEntity(entityId: string): Promise<any|null> {
        try {
            let result = await this.homeassistantRequest("api/states/" + entityId);
            if (result.state == "unavailable") {
                return null;
            }
            return result.state;
        }
        catch (e) {
            throw new Error("Could not get sensor value for sensor: " + entityId + ": " + (e as Error).message);
        }
    }

    /**
     * API is described here: https://developers.home-assistant.io/docs/api/rest
     *
     * Um rauszufinden, wie die Service Befehle heißen (siehe z.B. toggleSwitch methode). Einfach im homeassistant UI eine Automatisierung anlegen und dort kriegt man im Aktionen Dropdown ensprechendes angezeigt
     * @param subUrl i.e. "api/states"
     */
    public async homeassistantRequest(subUrl: string, method: Method = "get", data = {}) {
        let requestUrl = url.resolve(this.homeAssistantUrl, subUrl);
        const result = await axios(requestUrl, {
            method: method,
            headers: {
                "Authorization": "Bearer " + this.accessToken
            },
            data: data,
        });

        return result.data;
    }

}
