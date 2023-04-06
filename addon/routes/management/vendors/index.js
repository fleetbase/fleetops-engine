import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ManagementVendorsIndexRoute extends Route {
    @service store;

    queryParams = {
        name: { refreshModel: true },
        email: { refreshModel: true },
        phone: { refreshModel: true },
        page: { refreshModel: true },
        limit: { refreshModel: true },
        sort: { refreshModel: true },
        query: { refreshModel: true },
        public_id: { refreshModel: true },
        internal_id: { refreshModel: true },
        created_at: { refreshModel: true },
        updated_at: { refreshModel: true },
        status: { refreshModel: true },
        type: { refreshModel: true },
    };

    model(params) {
        return this.store.query('vendor', { ...params });
    }
}
