import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  getSchemaPath,
  type ApiResponseOptions,
} from '@nestjs/swagger';
import { AppSuccessResponse } from '../dto/app-success-response.dto';

/**
 * Documents a handler as returning `AppSuccessResponse<model>` (or an array in
 * `data`). The runtime wrapping is done by ResponseInterceptor — this is docs only.
 */
export function ApiEnvelope<TModel extends Type<unknown>>(
  model: TModel,
  opts: { status?: number; isArray?: boolean } = {},
) {
  const { status = 200, isArray = false } = opts;
  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  const options: ApiResponseOptions = {
    status,
    schema: {
      allOf: [
        { $ref: getSchemaPath(AppSuccessResponse) },
        { properties: { data: dataSchema } },
      ],
    },
  };

  return applyDecorators(
    ApiExtraModels(AppSuccessResponse, model),
    ApiResponse(options),
  );
}
