export { curriculumService, CurriculumService } from './CurriculumService';
export { ChunkedCurriculumService } from './ChunkedCurriculumService';
export { useCurriculum } from './useCurriculum';

// Export singleton instance of ChunkedCurriculumService
import { ChunkedCurriculumService } from './ChunkedCurriculumService';
export const chunkedCurriculumService = new ChunkedCurriculumService();
