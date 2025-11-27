import { CreateApiKeyUsecase } from "@core/usecases/ApiKeyUseCase/CreateApiKeyUsecase";
import { ValidateAdminKeyUsecase } from "@core/usecases/ApiKeyUseCase/ValidateAdminKeyUsecase";
import { CreateApiKeyController } from "@infra/http/controllers/CreateApiKeyController";
import { AuthRepository } from "@infra/database/AuthRepository";

export const AdminModule = () => {
  const authRepo = new AuthRepository();

  const createApiKeyUseCase = new CreateApiKeyUsecase(authRepo);
  const validateAdminKeyUseCase = new ValidateAdminKeyUsecase(authRepo);

  const createApiKeyController = new CreateApiKeyController(
    createApiKeyUseCase
  );

  return {
    createApiKeyController,
    validateAdminKeyUseCase,
  };
};
