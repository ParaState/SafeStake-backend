const dotenv = require("dotenv");
dotenv.config();
// 引入express
const express = require("express");
const bodyParser = require("body-parser");

var Dvf = require("./src/dvf");
var beacon = require("./src/beacon");
var config = require("./config/config");
const { response } = require("express");

let dvf = new Dvf(true);
const app = express();
app.use(function (req, res, next) {
  res.append("access-control-allow-origin", "*");
  res.append("content-type", "application/json; charset=utf-8");
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("Hello World"));

app.get("/v1/operators", async (req, res) => {
  const params = req.query;
  if (!params || !params.page || !params.perPage) {
    return res.json({});
  }
  const page = parseInt(params.page);
  const perPage = parseInt(params.perPage);
  if (page < 1 || perPage < 1) {
    return res.json({});
  } else {
    let current_epoch = 0;
    await beacon.get_latest_state().then((res) => {
      current_epoch = res.currentEpoch;
    });
    dvf
      .operators_list(
        page,
        perPage,
        params.validatorsCount,
        params.status,
        params.ordering,
        current_epoch,
        params.search
      )
      .then((response) => {
        return res.json(response);
      })
      .catch((err) => {
        console.log(err);
        return res.json({});
      });
  }
});

app.get("/v1/validators", async (req, res) => {
  const params = req.query;
  if (!params || !params.page || !params.perPage) {
    return res.json({});
  }
  const page = parseInt(params.page);
  const perPage = parseInt(params.perPage);
  if (page < 1 || perPage < 1) {
    return res.json({});
  } else {
    dvf
      .validators_list(page, perPage, params.operators)
      .then((response) => {
        return res.json(response);
      })
      .catch((err) => {
        console.log(err);
        return res.json({});
      });
  }
});

app.get("/v1/search/validators", async (req, res) => {
  let params = req.query;
  if (!params || params.operator_pk) {
    return res.json({});
  }
  if (!params.offset) {
    params.offset = 0;
  }
  if (!params.limit) {
    params.limit = -1;
  }
  dvf
    .get_validators_by_node(params.operator_pk, params.offset, params.limit)
    .then((response) => {
      return res.json(response);
    })
    .catch((err) => {
      console.log(err);
      return res.json({});
    });
});

app.get("/v1/operators/:address", async (req, res) => {
  if (
    !req.query ||
    !req.query.performances ||
    !req.params ||
    !req.params.address
  ) {
    return res.json({});
  }
  let current_epoch = 0;
  await beacon.get_latest_state().then((res) => {
    current_epoch = res.currentEpoch;
  });
  dvf
    .operator_get_performance(
      req.params.address,
      req.query.performances,
      current_epoch
    )
    .then((response) => {
      return res.json(response);
    })
    .catch((err) => {
      console.log(err);
      return res.json({});
    });
});

app.get("/v1/operators/owned_by/:address", async (req, res) => {
  const params = req.query;
  if (!params || !params.page || !params.perPage || !req.params || !req.params.address) {
    return res.json({});
  }
  const page = parseInt(params.page);
  const perPage = parseInt(params.perPage);
  if (page < 1 || perPage < 1) {
    return res.json({});
  } else {
    let current_epoch = 0;
    await beacon.get_latest_state().then((res) => {
      current_epoch = res.currentEpoch;
    });
    dvf
      .operators_list_by_address(
        page,
        perPage,
        current_epoch,
        req.params.address
      )
      .then((response) => {
        return res.json(response);
      })
      .catch((err) => {
        console.log(err);
        return res.json({});
      });
  }
});

app.get("/v1/validators/in_operator/:address", async (req, res) => {
  if (
    !req.query ||
    !req.params ||
    !req.query.page ||
    !req.query.perPage ||
    !req.params.address
  ) {
    return res.json({});
  }
  dvf
    .validators_list_in_operator(
      parseInt(req.query.page),
      parseInt(req.query.perPage),
      req.params.address
    )
    .then((response) => {
      return res.json(response);
    })
    .catch((err) => {
      console.log(err);
      return res.json({});
    });
});

app.get("/v1/validators/:pk", async (req, res) => {
  if (!req.query || !req.params || !req.query.performances || !req.params.pk) {
    return res.json({});
  }
  dvf
    .validator_get_performance(req.params.pk, req.query.performances)
    .then((response) => {
      return res.json(response);
    })
    .catch((err) => {
      console.log(err);
      return res.json({});
    });
});

app.get("/v1/validators/owned_by/:address", async (req, res) => {
  const params = req.query;
  if (!params || !params.page || !params.perPage || !req.params || !req.params.address) {
    return res.json({});
  }
  const page = parseInt(params.page);
  const perPage = parseInt(params.perPage);
  if (page < 1 || perPage < 1) {
    return res.json({});
  } else {
    dvf
      .validators_list_by_address(
        page,
        perPage,
        req.params.address
      )
      .then((response) => {
        return res.json(response);
      })
      .catch((err) => {
        console.log(err);
        return res.json({});
      });
  }
});

app.get("/v1/duties/:pk", async (req, res) => {
  if (
    !req.query ||
    !req.params ||
    !req.query.page ||
    !req.query.perPage ||
    !req.params.pk
  ) {
    return res.json({});
  }
  dvf
    .validator_get_duties(
      req.params.pk,
      parseInt(req.query.page),
      parseInt(req.query.perPage)
    )
    .then((response) => {
      return res.json(response);
    })
    .catch((err) => {
      console.log(err);
      return res.json({});
    });
});

app.post("/v1/collect_performance", async function (req, res) {
  const params = req.body;
  let result = { err: "yes" };
  if (
    !params ||
    !params.publicKey ||
    !params.operators ||
    params.operators.length < 3 ||
    !params.slot ||
    !params.epoch
  ) {
    return res.json(result);
  }
  dvf.collect_performance(params).then(res=>{
    result.err = "no";
    return res.json(result);
  })
  .catch((e) => {
    console.log(e);
    return res.json(result);
  });
});

app.get("/v1/search", async function (req, res) {
  const params = req.query;
  if (!params.query) {
    return res.json({});
  }
  dvf
    .key_search(params.query)
    .then((response) => {
      return res.json(response);
    })
    .catch((err) => {
      console.log(err);
      return res.json({});
    });
});

app.listen(config.SERVER_PORT, () =>
  console.log("Start Server, listening on port " + config.SERVER_PORT + "!")
);
