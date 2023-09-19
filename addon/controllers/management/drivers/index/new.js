import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import generateSlug from '@fleetbase/ember-core/utils/generate-slug';

export default class ManagementDriversIndexNewController extends Controller {
    /**
     * Inject the `currentUser` service
     *
     * @var {Service}
     */
    @service store;

    /**
     * Resets the service rate form
     *
     * @void
     */
    @action resetForm() {
        this.drivers = this.store.createRecord('driver');
    }

    /**
     * Handle back button action
     *
     * @return {Transition}
     */
    @action transitionBack() {
        return this.transitionToRoute('management.drivers.index').then(() => {
            this.resetForm();
        });
    }
}
