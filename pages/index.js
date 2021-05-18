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
      showNewModal: false,
    });

    if (window.location.hash && window.location.hash.length > 1) {
      const hash = window.location.hash.substr(1);

      const job = _.filter(jobs, (job) => job.name === hash)[0];
      if (job) {
        job.environmentVariables = job.environmentVariables || [];
        this.setState({ job });
      }
    }
  }

  openJob(job) {
    const that = this;
    job.environmentVariables = job.environmentVariables
      ? job.environmentVariables.sort((a, b) => a.name.localeCompare(b.name))
      : [];

    window.location.hash = "#" + encodeURIComponent(job.name);
    this.setState({ job: undefined }, () => that.setState({ job }));
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
      <div className="form-group row">
        <label className="col-sm-3 col-form-label" for={fieldName}>
          {fieldName}
        </label>
        <div class="col-sm-9">
          <input
            id={fieldName}
            className="form-control"
            style={style}
            onChange={(evt) => that.updateField(path, evt.target.value)}
            type="text"
            value={_.get(this.state.job, path)}
          />
        </div>
      </div>
    );
  }

  makeCheckbox(fieldName, path) {
    const that = this;
    return (
      <div class="form-group row">
        <div class="col-sm-2">{fieldName}</div>
        <div class="col-sm-10">
          <div class="form-check">
            <input
              id={fieldName}
              className="form-check-input"
              type="checkbox"
              onChange={(evt) => that.updateField(path, evt.target.checked)}
              checked={_.get(this.state.job, path)}
            />
          </div>
        </div>
      </div>
    );
  }

  makeTextarea(fieldName, path) {
    const that = this;
    return (
      <div className="form-group">
        <label for={fieldName}>{fieldName}</label>
        <textarea
          className="form-control"
          id={fieldName}
          rows="3"
          onChange={(evt) => that.updateField(path, evt.target.value)}
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

  async runJob(job) {
    await fetch("/run_job/" + encodeURIComponent(job));
  }

  async saveJob(job) {
    // Clean up the container blob
    if (job.container && !job.container.image) {
      delete job.container;
    }

    await fetch("/job", {
      body: JSON.stringify(job),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
  }

  async deleteJob(job) {
    if (!confirm(`Are you sure you want to delete ${job.name}?`)) {
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
    job.constraints.unshift(["", "EQUALS"]);
    this.setState({ job });
  }

  updateSearch(evt) {
    this.setState({
      search: evt.target.value,
    });
  }

  showNewModal() {
    this.setState({
      showNewModal: true,
      newJobName: "",
    });
  }

  hidNewModal() {
    this.setState({
      showNewModal: false,
    });
  }

  newJobName(evt) {
    this.setState({
      newJobName: evt.target.value,
    });
  }

  showNewJob() {
    this.openJob({
      name: this.state.newJobName,
      description: "",
      environmentVariables: [],
      container: null,
      constraints: [],
    });
    this.setState({
      showNewModal: false,
    });
  }

  render() {
    const that = this;
    const jobObject = _.get(this, "state.job");

    const job = jobObject && (
      <form>
        <div className="container">
          <div
            className="btn-group btn-group-md"
            role="group"
            aria-label="Job actions"
          >
            <button
              type="button"
              onClick={() => that.runJob(that.state.job.name)}
              className="btn btn-success mr-1"
            >
              Run
            </button>
            <button
              type="button"
              onClick={() => that.saveJob(that.state.job)}
              className="btn btn-success mr-1"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => that.deleteJob(that.state.job)}
              className="btn btn-danger mr-1"
            >
              Delete
            </button>
          </div>

          <div
            className="btn-group btn-group-md float-right"
            role="group"
            aria-label="Duplicate job"
          >
            <input
              type="text"
              placeholder="Enter name for new job"
              onChange={that.updateDuplicateName.bind(that)}
              value={this.state.duplicateName}
              className="mr-1"
            />
            <button
              type="button"
              onClick={that.duplicate.bind(that)}
              className="btn btn-primary mr-1"
              disabled={!Boolean(that.state.duplicateName)}
            >
              Duplicate
            </button>
          </div>
        </div>

        <div className="container">
          <hr />
          <h2>{this.state.job.name}</h2>

          <h5>Job Owner & Description</h5>
          {that.makeInputField("Name", "ownerName")}
          {that.makeInputField("Email", "owner")}
          {this.makeTextarea("Description", "description")}

          <h5>Runtime</h5>
          {that.makeInputField("Image (if required)", "container.image")}
          {this.makeTextarea("Command", "command")}
          {this.makeCheckbox("Async", "async")}
          {this.makeCheckbox("Disabled", "disabled")}
          {this.makeCheckbox("Shell", "shell")}

          <h5>Resources</h5>
          {that.makeInputField("CPUs", "cpus")}
          {that.makeInputField("Memory (MB)", "mem")}
          {that.makeInputField("Disk (MB)", "disk")}

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
          {_.get(this, "state.job.constraints", []).map(function (envVar, idx) {
            return (
              <div>
                <input
                  type="text"
                  value={envVar[0]}
                  onChange={function (evt) {
                    that.updateField(
                      ["constraints", idx, "0"],
                      evt.target.value
                    );
                  }}
                  style={{ width: "160px" }}
                />
                &nbsp;&nbsp;EQUALS&nbsp;&nbsp;
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
                <span onClick={() => that.removeEnvVar(envVar)}>X</span>
              </div>
            );
          })}

          <br />

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
                <span onClick={() => that.removeEnvVar(envVar)}>X</span>
              </div>
            );
          })}
          <div style={{ height: "20px", width: "100px" }}></div>
        </div>
      </form>
    );

    return (
      <div
        className="container"
        style={{
          height: "100%",
        }}
      >
        <div
          className="modal"
          tabIndex="-1"
          role="dialog"
          style={{
            display: _.get(that, "state.showNewModal") ? "block" : "none",
          }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">New Job</h5>
                <button
                  onClick={that.hidNewModal.bind(that)}
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Job Name</p>
                <input
                  value={_.get(that, "state.newJobName")}
                  onChange={that.newJobName.bind(that)}
                  type="text"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={that.showNewJob.bind(that)}
                >
                  Create
                </button>
                <button
                  onClick={that.hidNewModal.bind(that)}
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        <h2>Chronos</h2>
        <div className="row">
          <div className="col-3">
            <button
              type="button"
              onClick={() => that.showNewModal()}
              className="btn btn-success"
            >
              New Job
            </button>
            <hr />
            <input
              type="text"
              className="form-control"
              aria-describedby="search"
              placeholder="Search"
              onChange={that.updateSearch.bind(that)}
            />
            <div
              className="list-group"
              style={{
                bottom: "0",
                height: "100%",
                overflowY: "scroll",
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
                    className={
                      "list-group-item list-group-item-action" +
                      (_.get(that, "state.job.name") == job.name
                        ? " active"
                        : "")
                    }
                    onClick={() => that.openJob(job)}
                    key={job.name}
                    style={{ cursor: "pointer" }}
                  >
                    {job.name}
                  </a>
                );
              })}
            </div>
          </div>
          <div
            className="col-9"
            style={{
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
