import Controller, { inject as controller } from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class ManagementVehiclesIndexDetailsController extends Controller {
  /**
     * True if updating service rate.
     *
     * @var {Boolean}
     */
  @tracked isUpdatingVehicle = false;
}
