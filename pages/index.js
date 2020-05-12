import _ from "lodash";
import React from "react";

export default class extends React.Component {
  async componentDidMount() {
    await this.refreshJobs();
  }

  async refreshJobs() {
    const result = await fetch("/job");
    const jobs = (await result.json()).items;
    this.setState({
      jobs,
    });

    if (window.location.hash && window.location.hash.length > 1) {
      const hash = window.location.hash.substr(1);

      const job = _.filter(jobs, (job) => job.name === hash)[0];
      if (job) {
        this.setState({
          job,
        });
      }
    }
  }

  openJob(job) {
    job.environmentVariables = job.environmentVariables.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    window.location.hash = "#" + encodeURIComponent(job.name);
    this.setState({
      job,
    });
  }

  removeEnvVar(envVar) {
    const job = this.state.job;
    job.environmentVariables = _.filter(
      job.environmentVariables,
      (a) => a.name !== envVar.name
    );
    this.setState({ job });
  }

  updateField(path, value) {
    const job = this.state.job;
    _.set(job, path, value);
    this.setState({ job });
  }

  makeInputField(fieldName, path, style) {
    const that = this;
    return (
      <div className={"form-group"}>
        {fieldName}:{" "}
        <input
          style={style}
          onChange={function (evt) {
            that.updateField(path, evt.target.value);
          }}
          type="text"
          value={_.get(this.state.job, path)}
        />
      </div>
    );
  }

  makeCheckbox(fieldName, path) {
    const that = this;
    return (
      <div className={"form-group"}>
        {fieldName}:{" "}
        <input
          type="checkbox"
          onChange={function (evt) {
            that.updateField(path, evt.target.checked);
          }}
          checked={_.get(this.state.job, path)}
        />
      </div>
    );
  }

  makeTextarea(fieldName, path) {
    const that = this;
    return (
      <div className={"form-group"}>
        {fieldName}:{" "}
        <textarea
          style={{ width: "100%" }}
          onChange={function (evt) {
            that.updateField(path, evt.target.value);
          }}
          value={_.get(this.state.job, path)}
        />
      </div>
    );
  }

  updateDuplicateName(evt) {
    this.setState({
      duplicateName: evt.target.value,
    });
  }

  runJob(job) {
    fetch("/run_job/" + encodeURIComponent(job));
  }

  saveJob(job) {
    console.log(job);

    const result = fetch("/job", {
      body: JSON.stringify(job),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
  }

  async deleteJob(job) {
    if (!confirm("Are you sure you want to delete: " + job.name + "?")) {
      return;
    }

    await fetch("/job/" + job.name, {
      headers: {
        "content-type": "application/json",
      },
      method: "DELETE",
    });

    return this.refreshJobs();
  }

  async duplicate() {
    const job = _.cloneDeep(this.state.job);
    job.name = this.state.duplicateName;

    await this.saveJob(job);

    return this.refreshJobs();
  }

  prependNewEnvVar() {
    const job = this.state.job;
    job.environmentVariables.unshift({ name: "", value: "" });
    this.setState({ job });
  }

  prependNewConstraint() {
    const job = this.state.job;
    job.constraints = job.constraints || [];
    job.constraints.unshift(["", ""]);
    this.setState({ job });
  }

  updateSearch(evt) {
    this.setState({
      search: evt.target.value,
    });
  }

  render() {
    const that = this;

    const job = _.get(this, "state.job") ? (
      <div style={{ width: "100%" }}>
        <div style={{ float: "right" }}>
          <button
            type="button"
            onClick={function () {
              that.runJob(that.state.job.name);
            }}
            className={"btn btn-success"}
          >
            Run
          </button>
          <button
            type="button"
            onClick={function () {
              that.saveJob(that.state.job);
            }}
            className={"btn btn-success"}
          >
            Save
          </button>
          <button
            type="button"
            onClick={function () {
              that.deleteJob(that.state.job);
            }}
            className={"btn btn-danger"}
          >
            Delete
          </button>
          <input
            type="text"
            onChange={that.updateDuplicateName.bind(that)}
            value={this.state.duplicateName}
          />{" "}
          <span onClick={that.duplicate.bind(that)}>Duplicate</span>
        </div>
        <h3>{this.state.job.name}</h3>
        {this.makeCheckbox("Async", "async")}
        {this.makeCheckbox("Disabled", "disabled")}
        {this.makeTextarea("Description", "description")}
        {this.makeTextarea("Command", "command")}
        {this.makeCheckbox("Shell", "shell")}

        <h5>Resources</h5>
        <div style={{ float: "left" }}>
          {that.makeInputField("CPUs", "cpus")}
        </div>
        <div style={{ float: "left", paddingLeft: "10px" }}>
          {that.makeInputField("Mem", "mem")}
        </div>
        <div style={{ float: "left", paddingLeft: "10px" }}>
          {that.makeInputField("Disk", "disk")}
        </div>
        <h5>Owner</h5>
        <div style={{ float: "left" }}>
          {that.makeInputField("Name", "ownerName")}
        </div>
        <div style={{ float: "left", paddingLeft: "10px" }}>
          {that.makeInputField("Email", "owner", { width: "300px" })}
        </div>

        <div style={{ clear: "both" }}></div>
        {this.state.job.container ? (
          <div>
            <h5>Container</h5>
            {that.makeInputField("Image", "container.image", {
              width: "600px",
            })}
          </div>
        ) : null}

        <h5>Schedule</h5>
        {that.makeInputField("Schedule", "schedule")}
        {that.makeInputField("Epsilon", "epsilon")}
        {that.makeInputField("scheduleTimeZone", "scheduleTimeZone")}

        <h5>Constraints</h5>
        <button
          className="btn btn-secondary"
          onClick={that.prependNewConstraint.bind(that)}
        >
          Add New Field
        </button>
        <br />
        <br />
        {this.state.job.constraints.map(function (envVar, idx) {
          return (
            <div>
              <input
                type="text"
                value={envVar[0]}
                onChange={function (evt) {
                  that.updateField(["constraints", idx, "0"], evt.target.value);
                }}
                style={{ width: "160px" }}
              />
              <select
                value={envVar[1]}
                onChange={function (evt) {
                  that.updateField(["constraints", idx, "1"], evt.target.value);
                }}
              >
                <option>CLUSTER</option>
                <option>GROUP_BY</option>
                <option>IS</option>
                <option>LIKE</option>
                <option>MAX_PER</option>
                <option>UNIQUE</option>
                <option>UNLIKE</option>
              </select>
              <input
                type="text"
                value={envVar[2]}
                onChange={function (evt) {
                  if (evt.target.value.length > 0) {
                    that.updateField(
                      ["constraints", idx, "2"],
                      evt.target.value
                    );
                  } else {
                    const job = that.state.job;
                    job.constraints[idx] = job.constraints[idx].slice(0, 2);
                    that.setState({ job });
                  }
                }}
                style={{ width: "150px" }}
              />
              <span
                onClick={function () {
                  that.removeEnvVar(envVar);
                }}
              >
                X
              </span>
            </div>
          );
        })}

        <h5>Environment Variables</h5>
        <button
          className="btn btn-secondary"
          onClick={that.prependNewEnvVar.bind(that)}
        >
          Add New Field
        </button>
        <br />
        <br />
        {this.state.job.environmentVariables.map(function (envVar, idx) {
          return (
            <div>
              <input
                type="text"
                value={envVar.name}
                onChange={function (evt) {
                  that.updateField(
                    ["environmentVariables", idx, "name"],
                    evt.target.value
                  );
                }}
                style={{ width: "300px" }}
              />{" "}
              ={" "}
              <input
                type="text"
                value={envVar.value}
                onChange={function (evt) {
                  that.updateField(
                    ["environmentVariables", idx, "value"],
                    evt.target.value
                  );
                }}
                style={{ width: "350px" }}
              />
              <span
                onClick={function () {
                  that.removeEnvVar(envVar);
                }}
              >
                X
              </span>
            </div>
          );
        })}
        <div style={{ height: "20px", width: "100px" }}></div>
      </div>
    ) : null;

    return (
      <div
        className=""
        style={{
          width: "1200px",
          margin: "0 auto",
          position: "relative",
          height: "100%",
        }}
      >
        <h2>Chronos</h2>
        <div
          className=""
          style={{ position: "absolute", top: "40px", bottom: "0" }}
        >
          <input
            type="text"
            class="form-control"
            aria-describedby="search"
            placeholder="Search"
            onChange={that.updateSearch.bind(that)}
          />
          <div
            class="list-group"
            style={{
              bottom: "0",
              height: "100%",
              //  border: "1px solid black",
              overflowY: "scroll",
              paddingLeft: "5px",
            }}
          >
            {_.get(this, "state.jobs", []).map(function (job) {
              if (
                that.state.search &&
                job.name.indexOf(that.state.search) < 0
              ) {
                return null;
              }
              return (
                <a
                  class={
                    "list-group-item list-group-item-action" +
                    (_.get(that, "state.job.name") == job.name ? " active" : "")
                  }
                  onClick={function () {
                    that.openJob(job);
                  }}
                  key={job.name}
                  style={{ cursor: "pointer" }}
                >
                  {job.name}
                </a>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              width: "700px",
              left: "420px",
              top: "0",
              height: "100%",
              overflowY: "scroll",
            }}
          >
            {job}
          </div>
        </div>
      </div>
    );
  }
}
