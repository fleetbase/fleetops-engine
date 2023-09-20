import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';


export default class ManagementVehiclesIndexDetailsViewRoute extends Route {
    @service store;
    @service currentUser;
    @service notifications;

    templateName = 'management.vehicles.index.new.details.view';
    model({ public_id }) {
        return this.store.queryRecord('vehicle', {
            public_id,
            single: true,
        });
    }

    async setupController(controller, model) {
        controller.vehicle = model;
    }
}
