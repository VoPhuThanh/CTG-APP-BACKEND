import { FacilitiesService } from './facilities.service';

describe('FacilitiesService', () => {
  let service: FacilitiesService;

  beforeEach(() => {
    service = new FacilitiesService({} as never, {} as never, {} as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
