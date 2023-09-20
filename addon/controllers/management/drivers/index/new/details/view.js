import ManagementDriversIndexDetailsNewController from './new';
import { tracked } from '@glimmer/tracking';
export default class ManagementDriversIndexDetailsViewController extends ManagementDriversIndexDetailsNewController {
    /**
     * True if updating service rate.
     *
     * @var {Boolean}
     */
    @tracked isUpdatingDriver = false;
}
