const assetService = require('../services/assetService');
const { assetSchema } = require('../validators/assetValidator');

class AssetController {
  async getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        status: req.query.status,
        criticality: req.query.criticality,
        categoryId: req.query.categoryId,
      };
      const assets = await assetService.getAllAssets(filters);
      return res.json(assets);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const asset = await assetService.getAssetById(req.params.id);
      return res.json(asset);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const validatedData = assetSchema.parse(req.body);
      const asset = await assetService.createAsset(validatedData, req.user.id, req.ip);
      return res.status(201).json(asset);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const validatedData = assetSchema.parse(req.body);
      const asset = await assetService.updateAsset(req.params.id, validatedData, req.user.id, req.ip);
      return res.json(asset);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await assetService.deleteAsset(req.params.id, req.user.id, req.ip);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await assetService.getCategories();
      return res.json(categories);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetController();
