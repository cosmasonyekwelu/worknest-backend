class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search() {
    if (this.queryString.keyword) {
      this.query = this.query.find({
        title: { $regex: this.queryString.keyword, $options: "i" },
      });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["keyword", "page", "limit"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Salary range
    if (queryObj.salaryMin && queryObj.salaryMax) {
      queryObj.salaryMin = { $gte: queryObj.salaryMin };
      queryObj.salaryMax = { $lte: queryObj.salaryMax };
    }

    this.query = this.query.find(queryObj);
    return this;
  }

  paginate(resultsPerPage) {
    const currentPage = Number(this.queryString.page) || 1;
    const skip = resultsPerPage * (currentPage - 1);

    this.query = this.query.limit(resultsPerPage).skip(skip);
    return this;
  }
}

module.exports = APIFeatures;
